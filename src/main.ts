// ==UserScript==
// @name         Instagram DM PWA
// @namespace    https://eth-p.dev/
// @author       ${ PROJECT.author }
// @version      ${ PROJECT.version }
// @description  ${ PROJECT.description }
// @match        https://www.instagram.com/direct/*
// @match        https://www.instagram.com/?utm_source=pwa_homescreen
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

import "./hooks/open-instagram-externally";

import "./hooks/hide-instagram-nav";
import "./hooks/hide-body-scrollbar";
import "./hooks/remove-instagram-margins";

import "./hooks/style-styled-scrollbar";
import "./hooks/style-dark-mode";
