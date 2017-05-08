import './scss/app.scss'
import Comments from './Comments.html'
import { POST_ID } from './util'

window.comments = new Comments({ target: document.getElementById('comments') })

