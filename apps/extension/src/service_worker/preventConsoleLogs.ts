// import { disableConsoleLogging } from "@/utils/disableConsoleLogging";

// Prevent console logs
// chrome.storage.local
//     .get("enableConsoleLogging")
//     .then((result) => result.enableConsoleLogging)
//     .then((enableConsoleLogging) => {
//         if (enableConsoleLogging != true || enableConsoleLogging != "1" || enableConsoleLogging != "true" || enableConsoleLogging != 1) {
//             disableConsoleLogging("service-worker");
//             setInterval(() => {
//                 disableConsoleLogging("service-worker");
//             }, 20000);
//         }
//     });
