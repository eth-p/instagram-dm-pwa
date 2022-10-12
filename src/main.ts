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

import "./feat/open-instagram-externally";

import "./feat/hide-instagram-nav";
import "./feat/hide-body-scrollbar";
import "./feat/remove-instagram-margins";

import "./feat/style-styled-scrollbar";
import "./feat/style-dark-mode";
