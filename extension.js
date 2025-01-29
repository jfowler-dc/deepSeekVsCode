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
					#responseHtml {border:1px solid #ccc; margin-top:20px; padding:24px; min-height:calc(100vh - 180px); max-height:calc(100vh - 180px); border-radius:12px; font-size:16px; line-height:24px; overflow:scroll;}
					#prompt {width:100%; box-sizing:border-box; border:1px solid #ccc; border-radius:12px; padding:12px; height:42px; font-size:14px; line-height:20px;}
					.message-container {display:flex;}
					think {display:none;}
					#askBtn {margin-left:12px; border-radius:12px; padding:12px 24px; cursor:pointer; font-size:14px; line-height:14px; box-sizing:border-box;}
				</style>
			</head>
			<body>
				<h2>DeepSeek VSCode Extension</h2>
				<div id="responseHtml"></div>
				<br/>
				<div class="message-container">
					<textarea id="prompt" rows="3" placeholder="Ask me something..."></textarea>
					<button id="askBtn">Ask</button>
				</div>
				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('askBtn').addEventListener('click', () => {
						const text = document.getElementById('prompt').value
						vscode.postMessage({command: 'chat', context:text})	
					})

					window.addEventListener('message', (e) => {
						const {command, text} = event.data

						if (command === 'chatResponse') {
							document.getElementById('responseHtml').innerHTML = text
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
