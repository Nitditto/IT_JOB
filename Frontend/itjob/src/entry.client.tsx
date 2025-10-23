import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'
import axios from "axios";
import './index.css'

        console.log('🚀 Configuring Axios defaults...');
        // 1. Tell Axios the name of the cookie to read from
        axios.defaults.xsrfCookieName = 'XSRF-TOKEN';

        // 2. Tell Axios the name of the header it needs to set
        axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

        // 3. Ensure cookies are sent with requests
        axios.defaults.withCredentials = true;
        axios.defaults.withXSRFToken = true;

hydrateRoot(
  document,
   <StrictMode>
    <HydratedRouter />
   </StrictMode>
);
