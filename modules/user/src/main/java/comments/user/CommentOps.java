// TODO copyright header

package comments.user;

import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * Comment ops.
 */
public final class CommentOps
{
    private CommentOps() {}

    static String validateAndProvide(Comment req, long now,
            Datastore store, WriteContext context, RpcHeader header)
    {
        // TODO
        return null;
    }
}
