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