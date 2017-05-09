//========================================================================
//Copyright 2017 David Yu
//------------------------------------------------------------------------
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at 
//http://www.apache.org/licenses/LICENSE-2.0
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License.
//========================================================================

package comments.user;

import static com.dyuproject.protostuffdb.EntityMetadata.ZERO_KEY;
import static com.dyuproject.protostuffdb.SerializedValueUtil.asInt64;
import static com.dyuproject.protostuffdb.SerializedValueUtil.readByteArrayOffsetWithTypeAsSize;

import java.io.IOException;

import com.dyuproject.protostuff.Input;
import com.dyuproject.protostuff.JsonXOutput;
import com.dyuproject.protostuff.KeyBuilder;
import com.dyuproject.protostuff.Output;
import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuff.RpcRuntimeExceptions;
import com.dyuproject.protostuff.ds.ParamRangeKey;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.ProtostuffPipe;
import com.dyuproject.protostuffdb.RangeV;
import com.dyuproject.protostuffdb.Visit;
import com.dyuproject.protostuffdb.Visitor;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * TODO
 * 
 * @author David Yu
 * @created May 1, 2017
 */
public final class CommentViews
{
    private CommentViews() {}
    
    private static final ParamRangeKey ASC = new ParamRangeKey(false);
    static
    {
        ASC.limit = -1;
    }
    
    static final Pipe.Schema<Comment> PS = new Pipe.Schema<Comment>(Comment.getSchema())
    {
        @Override
        protected void transfer(Pipe pipe, Input input, Output output) throws IOException
        {
            for (int number = input.readFieldNumber(wrappedSchema);
                    number != 0;
                    number = input.readFieldNumber(wrappedSchema))
            {
                // exclude keychain
                if (number == Comment.FN_KEY_CHAIN)
                    input.handleUnknownField(number, wrappedSchema);
                else
                    Comment.transferField(number, pipe, input, output, wrappedSchema);
            }
        }
    };
    
    static Pipe.Schema<Comment> psComment(RpcHeader header)
    {
        return PS;
    }
    
    static final int MAX_ENTITY_SIZE = 1 + 8 // ts
            // excluded in the response via the custom pipe schema above
            //+ 1 + 2 + 9 + (127 * 9) // key_chain
            + 1 + 2 + (127*3) // name
            + 1 + 2 + (2048*3) // content
            + 1 + 8 // post_id
            + 1 + 1 // depth
            + 1 + 9; // parent_key
    
    // the serialized size of numeric json is larger than protostuff
    static final int MAX_RESPONSE_LIMIT = 0xFFFF - (MAX_ENTITY_SIZE * 2);
    
    static final Visitor<RpcResponse> PV = new Visitor<RpcResponse>()
    {
        public boolean visit(byte[] key, 
                byte[] v, int voffset, int vlen, 
                RpcResponse res, int index)
        {
            final ProtostuffPipe pipe = res.context.pipe.set(key, v, voffset, vlen);
            try
            {
                res.writeRawNested(pipe.fieldNumber(), 
                        pipe, pipe.schema(), pipe.repeated());
            }
            catch (IOException e)
            {
                throw RpcRuntimeExceptions.pipe(e);
            }
            
            return res.output instanceof JsonXOutput && 
                    ((JsonXOutput)res.output).getSize() >= MAX_RESPONSE_LIMIT;
        }
    };
    
    static <V> boolean visitByPostId(long postId, 
            Datastore store, WriteContext context, 
            Visitor<V> visitor, V param)
    {
        return visitByPostId(postId, store, context, RangeV.Store.V, visitor, param);
    }
    
    static <V> boolean visitByPostId(long postId, 
            Datastore store, WriteContext context, 
            RangeV.Store visitorType, 
            Visitor<V> visitor, V param)
    {
        return Visit.by8(Comment.IDX_POST_ID__KEY_CHAIN, postId,
                Comment.EM, Comment.PList.FN_P, ASC,
                visitorType, store, context,
                visitor, param);
    }
    
    static boolean listByPostId(Comment.ByPostId req, Datastore store, RpcResponse res,
            Pipe.Schema<Comment.PList> resPipeSchema, RpcHeader header) throws IOException
    {
        return req.parentKey == null ? 
                visitWith(req.postId, req.lastSeenKey, store, res) :
                visitWithParent(req.parentKey, req.postId, req.lastSeenKey, store, res);
    }
    
    static boolean visitWith(long postId, byte[] lastSeenKey, 
            Datastore store, RpcResponse res)
    {
        if (lastSeenKey == null)
        {
            res.context.ps = PS;
            
            return visitByPostId(postId,
                    store, res.context,
                    RangeV.Store.CONTEXT_PV,
                    PV, res);
        }
        
        // visit starting at the entry after the last seen one
        lastSeenKey[lastSeenKey.length - 1] |= 0x02;
        
        return pipeTo(res, store, res.context, res.context.kb()
                .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                .$append(ZERO_KEY)
                .$append(lastSeenKey)
                .$push()
                .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                .$append8(0xFF)
                .$push());
    }
    
    static boolean visitWithParent(byte[] parentKey, long postId, byte[] lastSeenKey, 
            Datastore store, RpcResponse res) throws IOException
    {
        final WriteContext context = res.context;
        final byte[] parentValue = store.get(parentKey, Comment.EM, null, context);
        
        if (parentValue == null)
            return res.fail("Parent comment does not exist!");
        
        if (postId != asInt64(Comment.VO_POST_ID, parentValue))
            return res.fail("Invalid post id.");
        
        final int offset = readByteArrayOffsetWithTypeAsSize(Comment.FN_KEY_CHAIN, parentValue, context),
                size = context.type;
        
        final KeyBuilder kb = context.kb()
                .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                // key chain
                .$append(parentValue, offset, size).$append(parentKey);
                
        if (lastSeenKey == null)
        {
            // starting at the first child
            kb.$append8(0);
        }
        else
        {
            // visit starting at the entry after the last seen one
            lastSeenKey[lastSeenKey.length - 1] |= 0x02;
            kb.$append(lastSeenKey);
        }
        
        return pipeTo(res, store, context, kb.$push()
                .begin(Comment.IDX_POST_ID__KEY_CHAIN, Comment.EM)
                .$append(postId)
                // key chain
                .$append(parentValue, offset, size).$append(parentKey)
                .$append8(0xFF)
                .$push());
    }
    
    static boolean pipeTo(RpcResponse res, Datastore store, WriteContext context, 
            KeyBuilder kb)
    {
        final ProtostuffPipe pipe = context.pipe.init(
                Comment.EM, PS, Comment.PList.FN_P, true);
        try
        {
            store.visitRange(false, -1, false, null, context, 
                    PV, res, 
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
