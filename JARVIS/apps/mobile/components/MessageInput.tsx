import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Send, Mic, Paperclip, Square } from 'lucide-react-native';

interface MessageInputProps {
  onSend: (text: string) => void;
  onVoicePress?: () => void;
  onAttachPress?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export const MessageInput = ({
  onSend,
  onVoicePress,
  onAttachPress,
  isStreaming,
  disabled,
}: MessageInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || isStreaming || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View className="p-3 bg-card border-t border-border flex-row items-center">
      {/* Attachment Button */}
      {onAttachPress && (
        <TouchableOpacity
          onPress={onAttachPress}
          className="p-2 mr-1 rounded-full bg-background/60 active:bg-border"
          accessibilityLabel="Attach file or image"
        >
          <Paperclip size={20} color="#94a3b8" />
        </TouchableOpacity>
      )}

      {/* Input box */}
      <View className="flex-1 bg-background rounded-2xl px-4 py-2 border border-border flex-row items-center min-h-[44px] max-h-[120px]">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask JARVIS anything..."
          placeholderTextColor="#64748b"
          multiline
          editable={!isStreaming && !disabled}
          className="flex-1 text-slate-100 text-sm max-h-[100px] py-1"
        />
      </View>

      {/* Mic or Send button */}
      {text.trim().length > 0 ? (
        <TouchableOpacity
          onPress={handleSend}
          disabled={isStreaming || disabled}
          className="ml-2 w-11 h-11 rounded-full bg-primary items-center justify-center shadow-lg active:scale-95"
          accessibilityLabel="Send message"
        >
          {isStreaming ? (
            <ActivityIndicator size="small" color="#090d16" />
          ) : (
            <Send size={18} color="#090d16" />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onVoicePress}
          className="ml-2 w-11 h-11 rounded-full bg-primary/20 border border-primary/40 items-center justify-center active:scale-95"
          accessibilityLabel="Voice Mode"
        >
          <Mic size={20} color="#38bdf8" />
        </TouchableOpacity>
      )}
    </View>
  );
};
