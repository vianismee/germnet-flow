Error Add Customer

react-dom-client.development.js:25630 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
multi-tabs.js:5075 Injected CSS loaded successfully
rbcevyhucziuhcuyilvs.supabase.co/rest/v1/customers?columns=%22customer_name%22%2C%22contact_person%22%2C%22email%22%2C%22phone_number%22&select=_:1 Failed to load resource: the server responded with a status of 400 ()
intercept-console-error.ts:44 Error saving customer: Object
error @ intercept-console-error.ts:44
fetch.ts:15 POST https://rbcevyhucziuhcuyilvs.supabase.co/rest/v1/customers?columns=%22customer_name%22%2C%22contact_person%22%2C%22email%22%2C%22phone_number%22&select=_ 400 (Bad Request)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
push.\_\_awaiter @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:115
page.tsx:92 Error saving customer: {code: '23502', details: 'Failing row contains (null, Chevian Berliandi Sahp…l.com, 085159446361, 2025-09-25 03:34:03.679698).', hint: null, message: 'null value in column "customer_id" of relation "customers" violates not-null constraint'}
error @ intercept-console-error.ts:44
handleSubmit @ page.tsx:92
await in handleSubmit
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
