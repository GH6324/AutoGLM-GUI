import React from 'react';
import type {
  DualModelStreamEvent,
  DualModelDecisionResultEvent,
  DualModelVisionRecognitionEvent,
  DualModelActionResultEvent,
} from '../api';

export interface DualModelState {
  // Decision model state
  decisionActive: boolean;
  decisionStage: string;
  decisionThinking: string;
  decisionResult: string;
  taskPlan: string[];

  // Vision model state
  visionActive: boolean;
  visionStage: string;
  visionDescription: string;
  visionAction: string;

  // Progress
  currentStep: number;
  totalSteps: number;

  // History
  decisions: DualModelDecisionResultEvent[];
  recognitions: DualModelVisionRecognitionEvent[];
  actions: DualModelActionResultEvent[];
}

// Helper hook to manage dual model state
export function useDualModelState() {
  const [state, setState] = React.useState<DualModelState>({
    decisionActive: false,
    decisionStage: 'idle',
    decisionThinking: '',
    decisionResult: '',
    taskPlan: [],
    visionActive: false,
    visionStage: 'idle',
    visionDescription: '',
    visionAction: '',
    currentStep: 0,
    totalSteps: 0,
    decisions: [],
    recognitions: [],
    actions: [],
  });

  const handleEvent = React.useCallback((event: DualModelStreamEvent) => {
    setState(prev => {
      switch (event.type) {
        case 'decision_start':
          return {
            ...prev,
            decisionActive: true,
            decisionStage: event.stage,
            visionActive: false,
          };

        case 'decision_thinking':
          return {
            ...prev,
            decisionThinking: prev.decisionThinking + event.chunk,
          };

        case 'decision_result':
          return {
            ...prev,
            decisionActive: false,
            decisionStage: 'idle',
            decisionThinking: '',
            decisionResult: `${event.decision.action}: ${event.decision.target}`,
            decisions: [...prev.decisions, event],
          };

        case 'task_plan':
          return {
            ...prev,
            taskPlan: event.plan.steps,
            totalSteps: event.plan.estimated_actions,
          };

        case 'vision_start':
          return {
            ...prev,
            visionActive: true,
            visionStage: event.stage,
            decisionActive: false,
          };

        case 'vision_recognition':
          return {
            ...prev,
            visionDescription: event.description,
            recognitions: [...prev.recognitions, event],
          };

        case 'action_start':
          return {
            ...prev,
            visionStage: 'executing',
            visionAction: `${event.action.action}: ${event.action.target}`,
          };

        case 'action_result':
          return {
            ...prev,
            visionActive: false,
            visionStage: 'idle',
            visionAction: `${event.action_type}: ${event.target} - ${event.success ? 'Success' : 'Failed'}`,
            actions: [...prev.actions, event],
          };

        case 'step_complete':
          return {
            ...prev,
            currentStep: event.step,
          };

        case 'task_complete':
          return {
            ...prev,
            decisionActive: false,
            visionActive: false,
            decisionStage: 'idle',
            visionStage: 'idle',
          };

        case 'error':
        case 'aborted':
          return {
            ...prev,
            decisionActive: false,
            visionActive: false,
            decisionStage: 'idle',
            visionStage: 'idle',
          };

        default:
          return prev;
      }
    });
  }, []);

  const reset = React.useCallback(() => {
    setState({
      decisionActive: false,
      decisionStage: 'idle',
      decisionThinking: '',
      decisionResult: '',
      taskPlan: [],
      visionActive: false,
      visionStage: 'idle',
      visionDescription: '',
      visionAction: '',
      currentStep: 0,
      totalSteps: 0,
      decisions: [],
      recognitions: [],
      actions: [],
    });
  }, []);

  return { state, handleEvent, reset };
}
