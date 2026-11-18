import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check, Zap, Eye, Wrench, ShieldCheck } from 'lucide-react-native';
import { useChatStore } from '../stores/chat.store';

interface ModelSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ModelSelectorModal = ({
  visible,
  onClose,
}: ModelSelectorModalProps) => {
  const { availableModels, selectedModel, setSelectedModel } = useChatStore();

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-card rounded-t-3xl border-t border-border max-h-[80%] p-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-border">
            <View>
              <Text className="text-lg font-bold text-slate-100">AI Model Registry</Text>
              <Text className="text-xs text-secondary mt-0.5">
                Select your preferred engine for reasoning and speed
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-background">
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Model list */}
          <ScrollView className="mt-4">
            {availableModels.map((model) => {
              const isSelected = selectedModel === model.modelId;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleSelect(model.modelId)}
                  className={`p-4 mb-3 rounded-2xl border ${
                    isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background/80 border-border'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-bold text-slate-100">
                          {model.displayName}
                        </Text>
                        {model.isFreeTier && (
                          <View className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                            <Text className="text-[10px] text-emerald-400 font-semibold">FREE</Text>
                          </View>
                        )}
                      </View>

                      {model.description && (
                        <Text className="text-xs text-secondary mt-1 leading-5">
                          {model.description}
                        </Text>
                      )}

                      {/* Capabilities pills */}
                      <View className="flex-row items-center mt-2.5 flex-wrap gap-2">
                        <View className="flex-row items-center bg-card px-2 py-1 rounded-md border border-border">
                          <Zap size={10} color="#38bdf8" />
                          <Text className="text-[10px] text-slate-300 ml-1">
                            {model.provider.toUpperCase()}
                          </Text>
                        </View>
                        <View className="bg-card px-2 py-1 rounded-md border border-border">
                          <Text className="text-[10px] text-slate-300">
                            {(model.contextWindow / 1024).toFixed(0)}k Context
                          </Text>
                        </View>
                        {model.supportsVision && (
                          <View className="flex-row items-center bg-card px-2 py-1 rounded-md border border-border">
                            <Eye size={10} color="#a855f7" />
                            <Text className="text-[10px] text-purple-300 ml-1">Vision</Text>
                          </View>
                        )}
                        {model.supportsTools && (
                          <View className="flex-row items-center bg-card px-2 py-1 rounded-md border border-border">
                            <Wrench size={10} color="#f59e0b" />
                            <Text className="text-[10px] text-amber-300 ml-1">Tools</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {isSelected && (
                      <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
                        <Check size={16} color="#090d16" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
