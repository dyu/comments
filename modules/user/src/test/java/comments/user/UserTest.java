// TODO copyright header

package comments.user;

import java.io.IOException;

import com.dyuproject.protostuffdb.AbstractStoreTest;

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

    Comment newComment(String name, String content, long postId) throws IOException
    {
        Comment message = new Comment(name, content, postId);
        assertInitialized(message);

        assertTrue(XCommentOps.create(message, store, res, 
                Comment.PList.getPipeSchema(), header));

        assertNotNull(message.key);

        return message;
    }

    public void testComment() throws IOException
    {
        newComment("hello", "world", 1);
    }
}
