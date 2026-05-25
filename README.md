# interview-architect-api
An AI-powered system-engineered career acceleration platform built using Node.js, Express, React, MongoDB, and the Google Gemini AI Pro engine.


#concept of token blalisting
THE BLACKLIST CHECK
               
🌐 Incoming Request -> 🍪 Has JWT Cookie
                            |
                            v
                 🔍 Check Redis Memory
                 "Is this token in the blacklist?"
                    /               \
                  YES                NO
                  /                    \
  💥 Reject Request (401)         🟢 Accept & Pass to next()


  #frontend

  4 layer architecture

  UI
  =>component
  =>pages

  HOOK => for managing state and api layers
  => hooks

  State
  => auth.context.jsx
  =>ai.context.jsx

  API => for communication with backend
  => services
    => auth.api.js

#frontend routing
main.jsx → RouterProvider → app.routes.jsx → pages.