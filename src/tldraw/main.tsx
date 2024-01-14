/* eslint-disable @typescript-eslint/naming-convention */
import App from './app.tsx'
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.querySelector('#root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)
