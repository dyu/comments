import './scss/app.scss'
import Comments from './Comments.html'
import { POST_ID } from './util'

if (POST_ID && typeof POST_ID === 'number' && POST_ID > 0) {
    window.comments = new Comments({ target: document.getElementById('comments') })
} else {
    console.log(`
    Before the comments.js script, insert:
    \`\`\`
    <script>window.comments_post_id = x</script>
    \`\`\`
      where x is a number greater than zero.
    `)
}

