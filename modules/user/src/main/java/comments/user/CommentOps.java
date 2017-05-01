// TODO copyright header

package comments.user;

import static com.dyuproject.protostuffdb.SerializedValueUtil.readByteArrayOffsetWithTypeAsSize;

import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.EntityMetadata;
import com.dyuproject.protostuffdb.OpChain;
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
}
