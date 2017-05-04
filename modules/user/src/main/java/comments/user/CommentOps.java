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
import com.dyuproject.protostuffdb.RangeV;
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
        
        if (req.parentKey != ZERO_KEY)
        {
            // user posted a reply
            final KeyBuilder kb = res.context.kb()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId);
                    
            final byte[] keyChain = req.keyChain,
                    startKey;
            if (lastSeenKey == null)
            {
                // visit starting at the first child
                startKey = new byte[keyChain.length + 1];
                System.arraycopy(keyChain, 0, startKey, 0, keyChain.length);
            }
            else
            {
                startKey = new byte[keyChain.length + 9];
                System.arraycopy(keyChain, 0, startKey, 0, keyChain.length);
                // visit starting the entry after the last seen one
                lastSeenKey[lastSeenKey.length - 1] |= 0x02;
                System.arraycopy(lastSeenKey, 0, startKey, keyChain.length, 9);
            }
            
            kb.$append(startKey).$push()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$append(keyChain)
                    .$append8(0xFF)
                    .$push();
            
            final ProtostuffPipe pipe = res.context.pipe.init(
                    Comment.EM, Comment.getPipeSchema(), Comment.PList.FN_P, true);
            try
            {
                store.visitRange(false, -1, false, null, res.context, 
                        RangeV.RES_PV, res, 
                        kb.buf(), kb.offset(-1), kb.len(-1), 
                        kb.buf(), kb.offset(), kb.len());
            }
            finally
            {
                pipe.clear();
            }
        }
        else if (lastSeenKey != null)
        {
            // visit starting the entry after the last seen one
            lastSeenKey[lastSeenKey.length - 1] |= 0x02;
            
            KeyBuilder kb = res.context.kb()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$append(ZERO_KEY)
                    .$append(lastSeenKey)
                    .$push()
                    /*.begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$push()*/
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$append8(0xFF)
                    .$push();
            
            final ProtostuffPipe pipe = res.context.pipe.init(
                    Comment.EM, Comment.getPipeSchema(), Comment.PList.FN_P, true);
            try
            {
                store.visitRange(false, -1, false, null/*kb.copy(-2)*/, res.context, 
                        RangeV.RES_PV, res, 
                        kb.buf(), kb.offset(-1), kb.len(-1), 
                        kb.buf(), kb.offset(), kb.len());
            }
            finally
            {
                pipe.clear();
            }
        }
        else
        {
            CommentViews.visitByPostId(req.postId,
                    store, res.context,
                    RangeV.Store.ENTITY_PV,
                    RangeV.RES_PV, res);
        }

        return true;
    }
}
