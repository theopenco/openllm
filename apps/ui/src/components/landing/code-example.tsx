import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/lib/components/button";
import { toast } from "@/lib/components/use-toast";

const codeExamples = {
	curl: {
		label: "cURL",
		language: "bash",
		code: `curl -X POST https://api.llmgateway.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $LLM_GATEWAY_API_KEY" \\
  -d '{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ]
}'`,
	},
	typescript: {
		label: "TypeScript",
		language: "typescript",
		code: `const response = await fetch('https://api.llmgateway.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.LLM_GATEWAY_API_KEY}\`
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ]
  })
});

if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}

const data = await response.json();
console.log(data.choices[0].message.content);`,
	},
	react: {
		label: "React",
		language: "tsx",
		code: `import { useState } from 'react';

function ChatComponent() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.llmgateway.io/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${process.env.REACT_APP_LLM_GATEWAY_API_KEY}\`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'user', content: 'Hello, how are you?' }
          ]
        })
      });
      
      if (!res.ok) {
        throw new Error(\`HTTP error! status: \${res.status}\`);
      }
      
      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {response && <p>{response}</p>}
    </div>
  );
}

export default ChatComponent;`,
	},
	nextjs: {
		label: "Next.js",
		language: "typescript",
		code: `import { createLLMGateway } from "@llmgateway/ai-sdk-provider";
import { generateText } from 'ai';

const llmgateway = createLLMGateway({ apiKey });

const { text } = await generateText({
  model: llmgateway('openai/gpt-4o'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});`,
	},
	python: {
		label: "Python",
		language: "python",
		code: `import requests
import os

response = requests.post(
    'https://api.llmgateway.io/v1/chat/completions',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {os.getenv("LLM_GATEWAY_API_KEY")}'
    },
    json={
        'model': 'gpt-4o',
        'messages': [
            {'role': 'user', 'content': 'Hello, how are you?'}
        ]
    }
)

response.raise_for_status()
print(response.json()['choices'][0]['message']['content'])`,
	},
	java: {
		label: "Java",
		language: "java",
		code: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

String apiKey = System.getenv("LLM_GATEWAY_API_KEY");
String requestBody = """
{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ]
}
""";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.llmgateway.io/v1/chat/completions"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer " + apiKey)
    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
    .build();

HttpResponse<String> response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());

System.out.println(response.body());`,
	},
	rust: {
		label: "Rust",
		language: "rust",
		code: `use reqwest::Client;
use serde_json::json;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let api_key = env::var("LLM_GATEWAY_API_KEY")?;
    
    let response = client
        .post("https://api.llmgateway.io/v1/chat/completions")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&json!({
            "model": "gpt-4o",
            "messages": [
                {"role": "user", "content": "Hello, how are you?"}
            ]
        }))
        .send()
        .await?;
    
    let result: serde_json::Value = response.json().await?;
    println!("{}", result["choices"][0]["message"]["content"]);
    Ok(())
}`,
	},
	go: {
		label: "Go",
		language: "go",
		code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

type ChatRequest struct {
    Model    string    \`json:"model"\`
    Messages []Message \`json:"messages"\`
}

type Message struct {
    Role    string \`json:"role"\`
    Content string \`json:"content"\`
}

func main() {
    apiKey := os.Getenv("LLM_GATEWAY_API_KEY")
    
    requestBody := ChatRequest{
        Model: "gpt-4o",
        Messages: []Message{
            {Role: "user", Content: "Hello, how are you?"},
        },
    }
    
    jsonData, _ := json.Marshal(requestBody)
    
    req, _ := http.NewRequest("POST", 
        "https://api.llmgateway.io/v1/chat/completions", 
        bytes.NewBuffer(jsonData))
    
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+apiKey)
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println("Response received")
}`,
	},

	php: {
		label: "PHP",
		language: "php",
		code: `<?php
$apiKey = $_ENV['LLM_GATEWAY_API_KEY'];

$data = [
    'model' => 'gpt-4o',
    'messages' => [
        ['role' => 'user', 'content' => 'Hello, how are you?']
    ]
];

$options = [
    'http' => [
        'header' => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$response = file_get_contents(
    'https://api.llmgateway.io/v1/chat/completions',
    false,
    $context
);

if ($response === FALSE) {
    throw new Exception('Request failed');
}

$result = json_decode($response, true);
echo $result['choices'][0]['message']['content'];
?>`,
	},
	ruby: {
		label: "Ruby",
		language: "ruby",
		code: `require 'net/http'
require 'json'
require 'uri'

uri = URI('https://api.llmgateway.io/v1/chat/completions')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri)
request['Content-Type'] = 'application/json'
request['Authorization'] = "Bearer #{ENV['LLM_GATEWAY_API_KEY']}"

request.body = {
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ]
}.to_json

response = http.request(request)

if response.code != '200'
  raise "HTTP Error: #{response.code}"
end

result = JSON.parse(response.body)
puts result['choices'][0]['message']['content']`,
	},
};

const getLanguageClass = (language: string) => {
	const languageMap: Record<string, string> = {
		bash: "language-bash",
		typescript: "language-typescript",
		python: "language-python",
		java: "language-java",
		rust: "language-rust",
		go: "language-go",
		tsx: "language-tsx",
		php: "language-php",
		ruby: "language-ruby",
	};
	return languageMap[language] || "language-text";
};

export function CodeExample() {
	const [activeTab, setActiveTab] = useState<keyof typeof codeExamples>("curl");

	const copyToClipboard = async (text: string, language: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast({
				title: "Copied to clipboard",
				description: `${language} code snippet has been copied to your clipboard.`,
				duration: 3000,
			});
		} catch (err) {
			console.error("Failed to copy text: ", err);
			toast({
				title: "Copy failed",
				description: "Could not copy to clipboard. Please try again.",
				variant: "destructive",
				duration: 3000,
			});
		}
	};

	const currentExample = codeExamples[activeTab];

	return (
		<section className="py-20 border-b border-zinc-200 dark:border-zinc-800">
			<div className="container mx-auto px-4">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl font-bold tracking-tight mb-6 text-center text-zinc-900 dark:text-white">
						Simple Integration
					</h2>

					<p className="text-zinc-600 dark:text-zinc-400 text-center mb-10">
						Just change your API endpoint and keep your existing code. Works
						with any language or framework.
					</p>

					{/* Language Tabs */}
					<div className="mb-6">
						<div className="flex flex-wrap gap-2 justify-center">
							{Object.entries(codeExamples).map(([key, example]) => (
								<button
									key={key}
									onClick={() => setActiveTab(key as keyof typeof codeExamples)}
									className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
										activeTab === key
											? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
											: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
									}`}
								>
									{example.label}
								</button>
							))}
						</div>
					</div>

					{/* Code Block */}
					<div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
						<div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
							<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								{currentExample.label} Example
							</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
								onClick={() =>
									copyToClipboard(currentExample.code, currentExample.label)
								}
							>
								<Copy className="h-4 w-4 mr-1" />
								Copy
							</Button>
						</div>

						<div className="relative bg-white dark:bg-zinc-950">
							<pre className="p-6 overflow-x-auto text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-200 max-h-96 overflow-y-auto">
								<code
									className={`${getLanguageClass(currentExample.language)} block whitespace-pre`}
								>
									{currentExample.code}
								</code>
							</pre>
						</div>
					</div>

					<p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
						LLM Gateway routes your request to the appropriate provider while
						tracking usage and performance across all languages and frameworks.
					</p>
				</div>
			</div>
		</section>
	);
}
