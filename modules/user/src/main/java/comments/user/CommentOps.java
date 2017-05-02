// TODO copyright header

package comments.user;

import static com.dyuproject.protostuffdb.EntityMetadata.ZERO_KEY;
import static com.dyuproject.protostuffdb.SerializedValueUtil.readByteArrayOffsetWithTypeAsSize;

import java.io.IOException;

import com.dyuproject.protostuff.KeyBuilder;
import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.EntityMetadata;
import com.dyuproject.protostuffdb.OpChain;
import com.dyuproject.protostuffdb.RangeV;
import com.dyuproject.protostuffdb.ValueUtil;
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

    static Comment validateAndProvide(Comment param, long now, OpChain chain)
    {
        byte[] parentKey = param.parentKey;
        if (parentKey.length == 0)
        {
            param.parentKey = EntityMetadata.ZERO_KEY;
            return param.provide(now, EntityMetadata.ZERO_KEY, 0);
        }
        
        final WriteContext context = chain.context;
        
        final byte[] parentValue = chain.vs().get(parentKey, Comment.EM, null);
        if (parentValue == null)
            throw DSRuntimeExceptions.operationFailure("Parent comment does not exist!");
        
        int offset = readByteArrayOffsetWithTypeAsSize(Comment.FN_KEY_CHAIN, parentValue, context),
                size = context.type,
                depth = size / 9;
        
        if (depth > 127)
            throw DSRuntimeExceptions.operationFailure("The nested replies are too deep and have exceeded the limit.");
        
        return param.provide(now, 
                append(parentValue, offset, size, parentKey), 
                depth);
    }
    
    static boolean create(Comment req, 
            Datastore store, RpcResponse res,
            Pipe.Schema<Comment.PList> resPipeSchema, 
            RpcHeader header) throws IOException
    {
        final byte[] lastSeenKey = req.key, 
                parentKey = req.parentKey,
                key = new byte[9];
        
        if (!store.chain(null, XCommentOps.OP_NEW, req, 0, res.context, key))
            return res.fail("Could not create.");
        
        req.key = key;
        
        if (parentKey.length != 0)
        {
            // user posted a reply
            final byte[] startKey;
            if (lastSeenKey == null)
            {
                startKey = ValueUtil.copy(req.keyChain, 0, req.keyChain.length - 8);
            }
            else
            {
                startKey = ValueUtil.copy(req.keyChain, 0, req.keyChain.length);
                // visit starting the entry after the last seen one
                lastSeenKey[lastSeenKey.length - 1] |= 0x02;
                System.arraycopy(lastSeenKey, 0, startKey, startKey.length - 9, 9);
            }
            
            KeyBuilder kb = res.context.kb()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$append(startKey)
                    .$push()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$push()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$append8(0xFF)
                    .$push();
            
            store.visitRange(false, -1, false, kb.copy(-2), res.context, 
                    RangeV.RES_PV, res, 
                    kb.buf(), kb.offset(-1), kb.len(-1), 
                    kb.buf(), kb.offset(), kb.len());
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
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$push()
                    .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                    .$append(req.postId)
                    .$append8(0xFF)
                    .$push();
            
            store.visitRange(false, -1, false, kb.copy(-2), res.context, 
                    RangeV.RES_PV, res, 
                    kb.buf(), kb.offset(-1), kb.len(-1), 
                    kb.buf(), kb.offset(), kb.len());
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
