import { renderHook, act } from '@testing-library/react-hooks';
import { NotificationContext } from '../../../context/NotificationContext';
import useTrainingBuilder from '../hooks/useTrainingBuilder';

// Mock des dépendances
jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('../hooks/useTrainingPlan', () => () => ({
  customPlan: null,
  generatePlan: jest.fn((data) => ({ ...data, weeks: [] })),
  exportPlan: jest.fn(() => true),
  convertPlanToCalendarEvents: jest.fn(() => [{ title: 'Test Event' }]),
}));

jest.mock('../hooks/useTrainingZones', () => () => ({
  zone1: { min: 0, max: 110 },
  zone2: { min: 111, max: 145 },
}));

describe('useTrainingBuilder Hook', () => {
  const mockNotify = jest.fn();
  const wrapper = ({ children }) => (
    <NotificationContext.Provider value={{ notify: mockNotify }}>
      {children}
    </NotificationContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useTrainingBuilder(), { wrapper });
    
    expect(result.current.goal).toBe('general');
    expect(result.current.experience).toBe('intermediate');
    expect(result.current.weeklyHours).toBe(8);
    expect(result.current.planDuration).toBe(12);
    expect(result.current.formSubmitted).toBe(false);
    expect(result.current.hasPlan).toBe(false);
  });

  test('should update fields correctly', () => {
    const { result } = renderHook(() => useTrainingBuilder(), { wrapper });
    
    act(() => {
      result.current.handleFieldChange('goal', 'endurance');
    });
    expect(result.current.goal).toBe('endurance');
    
    act(() => {
      result.current.handleFieldChange('experience', 'advanced');
    });
    expect(result.current.experience).toBe('advanced');
    
    act(() => {
      result.current.handleFieldChange('weeklyHours', 12);
    });
    expect(result.current.weeklyHours).toBe(12);
  });

  test('should validate form correctly', () => {
    const { result } = renderHook(() => useTrainingBuilder(), { wrapper });
    
    // Valeurs valides par défaut
    act(() => {
      result.current.handleGeneratePlan();
    });
    expect(result.current.formSubmitted).toBe(true);
    expect(mockNotify).toHaveBeenCalledWith('training.planGenerated', 'success');
    
    // Reset pour le prochain test
    act(() => {
      result.current.resetForm();
    });
    expect(result.current.formSubmitted).toBe(false);
    
    // Valeur invalide pour weeklyHours
    act(() => {
      result.current.handleFieldChange('weeklyHours', 2); // Trop bas
      result.current.handleGeneratePlan();
    });
    expect(result.current.formSubmitted).toBe(false);
    expect(result.current.validationErrors.weeklyHours).toBeDefined();
  });

  test('should handle exporting plan correctly', () => {
    const { result } = renderHook(() => useTrainingBuilder(), { wrapper });
    
    act(() => {
      result.current.handleExportPlan();
    });
    
    expect(mockNotify).toHaveBeenCalledWith('training.planExported', 'success');
  });

  test('should handle adding plan to calendar correctly', () => {
    const { result } = renderHook(() => useTrainingBuilder(), { wrapper });
    
    act(() => {
      result.current.handleAddToCalendar();
    });
    
    expect(mockNotify).toHaveBeenCalledWith('training.planAddedToCalendar', 'success');
  });

  test('should reset form correctly', () => {
    const { result } = renderHook(() => useTrainingBuilder(), { wrapper });
    
    // Changer quelques valeurs
    act(() => {
      result.current.handleFieldChange('goal', 'performance');
      result.current.handleFieldChange('weeklyHours', 15);
      result.current.handleFieldChange('planDuration', 16);
    });
    
    // Puis réinitialiser
    act(() => {
      result.current.resetForm();
    });
    
    // Vérifier que tout est revenu à la valeur par défaut
    expect(result.current.goal).toBe('general');
    expect(result.current.experience).toBe('intermediate');
    expect(result.current.weeklyHours).toBe(8);
    expect(result.current.planDuration).toBe(12);
    expect(result.current.formSubmitted).toBe(false);
  });
});
