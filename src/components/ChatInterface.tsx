import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Network, Brain, FileText, AlertCircle } from 'lucide-react';
import { HuggingFaceClient } from '../lib/llm/HuggingFaceClient';
import { DocumentProcessor } from '../lib/document/DocumentProcessor';
import { P2PNetwork } from '../lib/p2p/P2PNetwork';

interface Message {
  type: 'user' | 'system';
  text: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isP2PConnected, setIsP2PConnected] = useState(false);
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const llmClient = useRef<HuggingFaceClient | null>(null);
  const p2pNetwork = useRef<P2PNetwork | null>(null);

  useEffect(() => {
    const handleProgress = (event: CustomEvent) => {
      setProcessingProgress(event.detail.progress);
      if (event.detail.progress === 100) {
        setIsProcessing(false);
      }
    };

    window.addEventListener('documentProcessingProgress', handleProgress as EventListener);
    return () => {
      window.removeEventListener('documentProcessingProgress', handleProgress as EventListener);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text: inputText }]);

    try {
      let response = '';
      if (isLLMConnected && llmClient.current) {
        setIsProcessing(true);
        response = await llmClient.current.generateText(inputText);
      } else {
        response = "LLM is not connected. Please connect to get AI responses.";
      }

      setMessages(prev => [...prev, { type: 'system', text: response }]);

      if (isP2PConnected && p2pNetwork.current) {
        p2pNetwork.current.broadcast({
          type: 'CHAT_MESSAGE',
          message: { input: inputText, response }
        });
      }
    } catch (err) {
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingProgress(0);

      const result = await DocumentProcessor.processDocument(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process document');
      }

      setMessages(prev => [...prev, {
        type: 'system',
        text: `Document processing started. ${result.chunks?.length || 0} chunks identified.`
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
      setIsProcessing(false);
    }
  };

  const connectToLLM = async () => {
    try {
      llmClient.current = new HuggingFaceClient("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");
      setIsLLMConnected(true);
      setMessages(prev => [...prev, {
        type: 'system',
        text: 'Successfully connected to Hugging Face LLM.'
      }]);
    } catch (err) {
      setError('Failed to connect to LLM. Please try again.');
    }
  };

  const connectToP2P = async () => {
    try {
      p2pNetwork.current = new P2PNetwork();
      setIsP2PConnected(true);
      setMessages(prev => [...prev, {
        type: 'system',
        text: `Connected to P2P network. Node ID: ${p2pNetwork.current.getNodeId()}`
      }]);
    } catch (err) {
      setError('Failed to connect to P2P network. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-100 text-red-900 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-900 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {isProcessing && processingProgress > 0 && (
        <div className="mx-4 mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Processing: {processingProgress.toFixed(1)}%
          </p>
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-200 flex space-x-2">
        <button
          onClick={connectToP2P}
          disabled={isP2PConnected}
          className={`p-2 rounded-lg flex items-center ${
            isP2PConnected ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <Network className="w-5 h-5 mr-1" />
          {isP2PConnected ? 'P2P Connected' : 'Connect P2P'}
        </button>
        
        <button
          onClick={connectToLLM}
          disabled={isLLMConnected}
          className={`p-2 rounded-lg flex items-center ${
            isLLMConnected ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <Brain className="w-5 h-5 mr-1" />
          {isLLMConnected ? 'LLM Connected' : 'Connect LLM'}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center disabled:opacity-50"
        >
          <FileText className="w-5 h-5 mr-1" />
          {isProcessing ? 'Processing...' : 'Upload Document'}
        </button>
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}