const vscode = require('vscode');
const { default: ollama } = require('ollama'); // CJS

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('DeepSeek Chat is now active.');

	const disposable = vscode.commands.registerCommand('deepseek.deepChat', function () {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'DeepSeek Chat',
			vscode.ViewColumn.One,
			{enableScripts: true}
		)

		panel.webview.html = getWebviewContent()

		panel.webview.onDidReceiveMessage( async (message) => {
			if (message.command === 'chat') {
				const userPrompt = message.context
				let responseText = ''
				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{role: 'user', content: userPrompt}],
						stream: true
					})

					for await (const part of streamResponse) {
						responseText += part.message.content
						panel.webview.postMessage({
							command: 'chatResponse',
							text: responseText
						})
					}
				}
				catch(err) {
					panel.webview.postMessage({
						command: 'chatRespone',
						text: `Error ${err}`
					})
					console.log(err)
					vscode.window.showErrorMessage('DeepSeek Chat Reposonse Error');
				}
			}
		})
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<style>
					body {}
					#prompt {width:100%; box-sizing:border-box;}
					#response {border:1px solid #ccc; margin-top:20px; padding:10px; min-height:100px;}
				</style>
			</head>
			<body>
				<h2>Deep VS Code Extension</h2>
				<textarea id="prompt" rows="3" placeholder="Ask me something..."></textarea>
				<br/>
				<button id="askBtn">Ask</button>
				<div id="response"></div>

				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('askBtn').addEventListener('click', () => {
						const text = document.getElementById('prompt').value
						vscode.postMessage({command: 'chat', context:text})	
					})

					window.addEventListener('message', (e) => {
						const {command, text} = event.data

						if (command === 'chatResponse') {
							document.getElementById('response').innerText = text
						}
					})
				</script>
			</body>
		</html>
	`
}

function deactivate() {
	console.log('Deactivated')
}

module.exports = {
	activate,
	deactivate
}
