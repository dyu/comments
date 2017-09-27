// TODO copyright header

package comments.user;

import java.io.IOException;
import java.util.List;
import java.util.Properties;

import com.dyuproject.protostuff.DSUtils;
import com.dyuproject.protostuff.JsonXOutput;
import com.dyuproject.protostuff.RpcService;
import com.dyuproject.protostuff.RpcServiceProvider;
import com.dyuproject.protostuff.RpcWorker;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.DatastoreManager;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * User service provider.
 */
public final class UserProvider extends RpcServiceProvider
{

    @Override
    public void fill(RpcService[] services, List<Integer> ids, 
            Datastore store, WriteContext context, Properties options, 
            DatastoreManager manager)
    {
        fill(services, ids, getClass());
        EntityRegistry.initSeq(store, context);
    }
    
    @Override
    public void handleLogUpdates(RpcWorker worker, 
            byte[] buf, int offset, int len)
    {
        processLogUpdates(worker, buf, offset, len);
    }
    
    @Override
    protected void processLogEntity(RpcWorker worker, int kind, 
            byte[] k, int koffset, byte[] v, int voffset, int vlen)
    {
        if (kind != Comment.KIND)
            return;
        
        final JsonXOutput output = worker.context.pubOutput.use(Comment.getSchema());
        try
        {
            DSUtils.writeStartTo(output);
            CommentOps.pubTo(output, worker.context, k, koffset, v, voffset, vlen);
            DSUtils.writeEndTo(output);
        }
        catch (IOException e)
        {
            throw new RuntimeException("Should not happen.");
        }
    }
    
    public static final UserServices.ForUser FOR_USER = new UserServices.ForUser(){};
}

