## 0.6.0 (2017-08-05)

* use protostuffdb 0.13.1

## 0.5.3 (2017-06-22)

* option ```ui_flags: 4``` moves the comment form to the bottom

## 0.5.2 (2017-06-21)

* provide fallback for the nameless oauth user (github somehow allows that)

## 0.5.1 (2017-06-21)

* refresh individual replies via the timeago button

## 0.5.0 (2017-06-20)

* real-time comments via protostuffdb's pubsub

## 0.4.0 (2017-06-16)

* authenticated comments via google/github/gitlab oauth

## 0.3.0 (2017-06-12)

* Added option: ```window.comments_content_limit = num // max: 2048```

## 0.2.0 (2017-05-08)

* Auto-generate post_id from ```window.location.hostname + window.location.pathname```
* Support colors for the names of the users
* Use dompurify to sanitize the comments

## 0.1.0 (2017-05-06)

* Initial release

