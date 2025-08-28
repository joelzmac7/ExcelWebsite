import { renderHook, act } from '@testing-library/react-hooks';
import useAutoSave from '../useAutoSave';

// Mock timer
jest.useFakeTimers();

describe('useAutoSave hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should save data to localStorage after delay', () => {
    const testData = { name: 'John Doe', email: 'john@example.com' };
    const formKey = 'test-form';
    const delay = 1000;

    const { result } = renderHook(() => useAutoSave(testData, formKey, delay));

    // Initially, nothing should be saved
    expect(localStorage.setItem).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(delay);
    });

    // Now localStorage.setItem should have been called
    expect(localStorage.setItem).toHaveBeenCalledWith(formKey, JSON.stringify(testData));
  });

  test('should load saved data from localStorage', () => {
    const savedData = { name: 'Jane Doe', email: 'jane@example.com' };
    const formKey = 'test-form';

    // Manually set item in localStorage
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedData));

    const { result } = renderHook(() => useAutoSave({}, formKey));

    // Call loadSavedData
    const loadedData = result.current.loadSavedData();

    // Check if localStorage.getItem was called with the correct key
    expect(localStorage.getItem).toHaveBeenCalledWith(formKey);

    // Check if the returned data matches what we saved
    expect(loadedData).toEqual(savedData);
  });

  test('should clear saved data from localStorage', () => {
    const formKey = 'test-form';

    const { result } = renderHook(() => useAutoSave({}, formKey));

    // Call clearSavedData
    act(() => {
      result.current.clearSavedData();
    });

    // Check if localStorage.removeItem was called with the correct key
    expect(localStorage.removeItem).toHaveBeenCalledWith(formKey);
  });

  test('should handle localStorage errors gracefully', () => {
    const testData = { name: 'John Doe' };
    const formKey = 'test-form';

    // Mock localStorage.setItem to throw an error
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage is not available');
    });

    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const { result } = renderHook(() => useAutoSave(testData, formKey, 0));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // Check if console.error was called
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('should update timer when data changes', () => {
    const initialData = { name: 'John Doe' };
    const updatedData = { name: 'Jane Doe' };
    const formKey = 'test-form';
    const delay = 1000;

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, formKey, delay),
      { initialProps: { data: initialData } }
    );

    // Fast-forward time but not enough to trigger save
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // No save should have happened yet
    expect(localStorage.setItem).not.toHaveBeenCalled();

    // Update the data
    rerender({ data: updatedData });

    // Fast-forward time to trigger save
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Now localStorage.setItem should have been called with updated data
    expect(localStorage.setItem).toHaveBeenCalledWith(formKey, JSON.stringify(updatedData));
  });
});