FR IT SOLUTIONS & TRAINING CONSULT: SITE + ADMIN SETUP (FIREBASE)

Files: index.html (site), blog.html (Digital Edge), admin.html (dashboard),
       config.js (your Firebase config), frit-db.js, seed.js (starter courses),
       firestore.rules (security rules), firebase.json (optional hosting setup)

ONE-TIME SETUP
1. Open console.firebase.google.com and choose your project (fritsolutions-trainingconsult).
2. Build > Firestore Database > Create database (start in production mode).
3. Firestore > Rules tab: paste everything from firestore.rules and click Publish.
4. Build > Authentication > Get started > Sign-in method: enable Email/Password.
   Then Users tab > Add user: create your admin email and password. Copy that user's UID.
5. Firestore > Data > Start collection named  admins  >  Document ID = the UID you copied
   (add any field, for example role = admin). Only people listed here can use the dashboard.
6. Project settings > General > Your apps > add a Web app (</> icon). Copy the config values
   (apiKey, authDomain, projectId, appId) into config.js.
7. Publish the files. Either:
   a) Firebase Hosting: install the Firebase CLI, run  firebase login  then  firebase deploy
      in this folder (firebase.json is included), or
   b) any web host: upload all files into one folder, then add your domain under
      Authentication > Settings > Authorized domains.
8. Open yoursite/admin.html, sign in, go to Courses, and click "Load starter courses".

Never put a service account or Admin SDK key in these files. The config values in config.js
are public by design; firestore.rules is what protects your data (registrations cannot be
read by visitors).

Until config.js is filled in, the site still works: courses show their built-in list and
registrations open the visitor's email app, as before.

UPDATING RULES LATER: whenever firestore.rules changes (for example to add Projects or Messages), open Firestore > Rules, replace everything with the new file's contents, and click Publish.
