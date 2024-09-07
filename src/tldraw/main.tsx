/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'

ReactDOM.createRoot(document.querySelector('#root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)
