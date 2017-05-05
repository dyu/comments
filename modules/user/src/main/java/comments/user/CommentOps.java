// TODO copyright header

package comments.user;

import static com.dyuproject.protostuffdb.EntityMetadata.ZERO_KEY;
import static com.dyuproject.protostuffdb.SerializedValueUtil.asInt64;
import static com.dyuproject.protostuffdb.SerializedValueUtil.readByteArrayOffsetWithTypeAsSize;

import java.io.IOException;
import java.util.Arrays;

import com.dyuproject.protostuff.KeyBuilder;
import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.ProtostuffPipe;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * Comment ops.
 */
public final class CommentOps
{
    private CommentOps() {}

    static byte[] append(byte[] data, int offset, int len, byte[] suffix)
    {
        byte[] buf = new byte[len+suffix.length];
        
        System.arraycopy(data, offset, buf, 0, len);
        
        System.arraycopy(suffix, 0, buf, len, suffix.length);
        
        return buf;
    }

    static boolean validateAndProvide(Comment param, long now, 
            Datastore store, WriteContext context, RpcResponse res) throws IOException
    {
        byte[] parentKey = param.parentKey;
        if (parentKey.length == 0 || Arrays.equals(parentKey, ZERO_KEY))
        {
            param.parentKey = ZERO_KEY;
            param.provide(now, ZERO_KEY, 0);
            return true;
        }
        
        final byte[] parentValue = store.get(parentKey, Comment.EM, null, context);
        if (parentValue == null)
            return res.fail("Parent comment does not exist!");
        
        if (param.postId.longValue() != asInt64(Comment.VO_POST_ID, parentValue))
            return res.fail("Invalid post id.");
        
        int offset = readByteArrayOffsetWithTypeAsSize(Comment.FN_KEY_CHAIN, parentValue, context),
                size = context.type,
                depth = size / 9;
        
        if (depth > 127)
            return res.fail("The nested replies are too deep and have exceeded the limit.");
        
        param.provide(now, 
                append(parentValue, offset, size, parentKey), 
                depth);
        
        return true;
    }
    
    static boolean create(Comment req, 
            Datastore store, RpcResponse res,
            Pipe.Schema<Comment.PList> resPipeSchema, 
            RpcHeader header) throws IOException
    {
        final byte[] lastSeenKey = req.key, 
                key = new byte[9];
        
        final WriteContext context = res.context;
        
        final long now = context.ts(Comment.EM);
        
        if (!validateAndProvide(req, now, store, context, res))
            return false;
        
        context.fillEntityKey(key, Comment.EM, now);
        
        store.insertWithKey(key, req, req.em(), null, context);
        
        req.key = key;
        
        if (req.parentKey == ZERO_KEY)
            return CommentViews.visitWith(req.postId, lastSeenKey, store, res);
        
        // user posted a reply
        final KeyBuilder kb = res.context.kb()
                .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(req.postId)
                .$append(req.keyChain);
                
        if (lastSeenKey == null)
        {
            // visit starting at the first child
            kb.$append8(0);
        }
        else
        {
            // visit starting at the entry after the last seen one
            lastSeenKey[lastSeenKey.length - 1] |= 0x02;
            kb.$append(lastSeenKey);
        }
        
        kb.$push()
                .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(req.postId)
                .$append(req.keyChain)
                .$append8(0xFF)
                .$push();
        
        final ProtostuffPipe pipe = res.context.pipe.init(
                Comment.EM, CommentViews.PS, Comment.PList.FN_P, true);
        try
        {
            store.visitRange(false, -1, false, null, res.context, 
                    CommentViews.PV, res, 
                    kb.buf(), kb.offset(-1), kb.len(-1), 
                    kb.buf(), kb.offset(), kb.len());
        }
        finally
        {
            pipe.clear();
        }

        return true;
    }
}
