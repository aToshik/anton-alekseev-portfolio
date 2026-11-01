/* TEMP (remove before merge): ?stage=s1 | s5 switches the case cover stage background for comparison */
(function () { var m = /[?&]stage=(s1|s5)\b/.exec(location.search); if (m) document.documentElement.setAttribute('data-cover-stage', m[1]); })();
