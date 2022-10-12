// -----------------------------------------------------------------------------
// Hook: style-styled-scrollbar
//
// This hook adds styled scrollbars for WebKit browsers.
// -----------------------------------------------------------------------------
import { stylesheet } from "../stylish";

stylesheet(`
    ::-webkit-scrollbar {
        width: 12px;
    }
  
    *::-webkit-scrollbar-track {
        background: rgb(var(--ig-highlight-background));
    }
  
    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: rgb(var(--ig-stroke));
    }
  
    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: rgb(var(--ig-focus-stroke));
    }
`);
