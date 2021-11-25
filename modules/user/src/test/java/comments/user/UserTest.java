// TODO copyright header

package comments.user;

import static com.dyuproject.protostuffdb.EntityMetadata.ZERO_KEY;
import static com.dyuproject.protostuffdb.SerializedValueUtil.asInt8;
import static com.dyuproject.protostuffdb.SerializedValueUtil.readByteArray;

import java.io.IOException;
import java.util.ArrayList;

import com.dyuproject.protostuffdb.AbstractStoreTest;
import com.dyuproject.protostuffdb.HasKV;
import com.dyuproject.protostuffdb.ValueUtil;
import com.dyuproject.protostuffdb.Visitor;

import org.junit.Test;

/**
 * User test.
 */
public class UserTest extends AbstractStoreTest
{

    UserProvider provider;

    public UserTest()
    {

    }

    public UserTest(UserProvider provider)
    {
        this.provider = provider;
    }

    @Override
    protected void init()
    {
        provider = new UserProvider();
    }
    
    Comment insert(Comment message) throws IOException
    {
        assertInitialized(message);

        assertTrue(CommentOps.create(message, store, res, 
                Comment.PList.getPipeSchema(), header));

        assertNotNull(message.key);

        return message;
    }

    Comment newComment(String name, String content, long postId) throws IOException
    {
        return insert(new Comment(name, content, postId));
    }
    
    @Test
    public void testComment() throws IOException
    {
        Comment entity = newComment("hello", "world", 1);
        ArrayList<HasKV> list = new ArrayList<HasKV>();
        assertTrue(CommentViews.visitByPostId(entity.postId, 
                store, context, Visitor.APPEND_KV, list));
        assertEquals(1, list.size());
        HasKV entry = list.get(0);
        assertEquals(0, asInt8(Comment.VO_DEPTH, entry.getValue()));
        byte[] keyChain = readByteArray(Comment.FN_KEY_CHAIN, entry.getValue(), context);
        assertTrue(ValueUtil.isEqual(keyChain, ZERO_KEY));
        // verify index key
        assertTrue(ValueUtil.isEqual(entry.getKey(), 
                context.kb().begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(entity.postId)
                .$append(ZERO_KEY)
                .$append(entity.key)
                .$push().copy()));
    }
    
    @Test
    public void testCommentReply() throws IOException
    {
        final long postId = 1;
        
        // first comment
        Comment entity = newComment("hello", "world", postId);
        ArrayList<HasKV> list = new ArrayList<HasKV>();
        assertTrue(CommentViews.visitByPostId(postId, 
                store, context, Visitor.APPEND_KV, list));
        assertEquals(1, list.size());
        HasKV entry = list.get(0);
        assertEquals(0, asInt8(Comment.VO_DEPTH, entry.getValue()));
        byte[] entityValue = entry.getValue();
        byte[] keyChain = readByteArray(Comment.FN_KEY_CHAIN, entry.getValue(), context);
        assertTrue(ValueUtil.isEqual(keyChain, ZERO_KEY));
        // verify index key
        assertTrue(ValueUtil.isEqual(entry.getKey(), 
                context.kb().begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                .$append(ZERO_KEY)
                .$append(entity.key)
                .$push().copy()));
        list.clear();
        
        // another comment
        Comment jack = newComment("jack", "hi", postId);
        assertTrue(CommentViews.visitByPostId(postId, 
                store, context, Visitor.APPEND_KV, list));
        assertEquals(2, list.size());
        // verify first
        assertTrue(ValueUtil.isEqual(entityValue, list.get(0).getValue()));
        
        entry = list.get(1);
        assertEquals(0, asInt8(Comment.VO_DEPTH, entry.getValue()));
        byte[] jackValue = entry.getValue();
        byte[] jackKeyChain = readByteArray(Comment.FN_KEY_CHAIN, entry.getValue(), context);
        assertTrue(ValueUtil.isEqual(jackKeyChain, ZERO_KEY));
        // verify index key
        assertTrue(ValueUtil.isEqual(entry.getKey(), 
                context.kb().begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                .$append(ZERO_KEY)
                .$append(jack.key)
                .$push().copy()));
        list.clear();
        
        // reply to the latest comment
        Comment jill = new Comment("jill", "hello", postId);
        jill.parentKey = jack.key;
        insert(jill);
        assertTrue(CommentViews.visitByPostId(postId, 
                store, context, Visitor.APPEND_KV, list));
        assertEquals(3, list.size());
        // verify first
        assertTrue(ValueUtil.isEqual(entityValue, list.get(0).getValue()));
        // verify second
        assertTrue(ValueUtil.isEqual(jackValue, list.get(1).getValue()));
        
        entry = list.get(2);
        assertEquals(1, asInt8(Comment.VO_DEPTH, entry.getValue()));
        byte[] jillValue = entry.getValue();
        byte[] jillKeyChain = readByteArray(Comment.FN_KEY_CHAIN, entry.getValue(), context);
        assertTrue(ValueUtil.isEqual(jillKeyChain, CommentOps.append(ZERO_KEY, 0, 9, jack.key)));
        // verify index key
        assertTrue(ValueUtil.isEqual(entry.getKey(), 
                context.kb().begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                .$append(ZERO_KEY)
                .$append(jack.key)
                .$append(jill.key)
                .$push().copy()));
        list.clear();
        
        // reply to first comment
        Comment john = new Comment("john", "foo", postId);
        john.parentKey = entity.key;
        insert(john);
        assertTrue(CommentViews.visitByPostId(postId, 
                store, context, Visitor.APPEND_KV, list));
        assertEquals(4, list.size());
        // verify first
        assertTrue(ValueUtil.isEqual(entityValue, list.get(0).getValue()));
        
        // verify second
        entry = list.get(1);
        assertEquals(1, asInt8(Comment.VO_DEPTH, entry.getValue()));
        byte[] johnKeyChain = readByteArray(Comment.FN_KEY_CHAIN, entry.getValue(), context);
        assertTrue(ValueUtil.isEqual(johnKeyChain, CommentOps.append(ZERO_KEY, 0, 9, entity.key)));
        // verify index key
        assertTrue(ValueUtil.isEqual(entry.getKey(), 
                context.kb().begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                .$append(ZERO_KEY)
                .$append(entity.key)
                .$append(john.key)
                .$push().copy()));
        
        // verify third
        assertTrue(ValueUtil.isEqual(jackValue, list.get(2).getValue()));
        
        // verify fourth
        assertTrue(ValueUtil.isEqual(jillValue, list.get(3).getValue()));
    }
}
