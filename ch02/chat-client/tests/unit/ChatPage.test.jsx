// ChatPage.test.jsx
import { vi } from 'vitest';
import React from 'react';
import { it, describe, expect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPage from '@/pages/ChatPage'; // Replace with your ChatPage component path
import { getAssistantResponse } from '@/lib/getAssistantResponse'; // Assuming getAssistantResponse is a function

// Mock getAssistantResponse using vi.mock
vi.mock('@/lib/getAssistantResponse');

describe('ChatPage component', () => {
  beforeEach(() => {
    // IntersectionObserver isn't available in test environment
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });
  it('renders initial hello message', () => {
    render(<ChatPage />);

    expect(screen.getByText("Hello, I'm ✴️ Astra")).toBeInTheDocument();
  });

  it('updates input value while typing', async () => {
    render(<ChatPage />);

    const inputField = screen.getByRole('textbox');
    const message = 'Test message';

    screen.logTestingPlaygroundURL();

    await userEvent.type(inputField, message);

    expect(inputField).toHaveValue(message);
  });

  test('displays loading state while fetching response', async () => {
    const mockGetAssistantResponse = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve({ content: 'Assistant response', role: 'assistant' }), 100)),
    );
    getAssistantResponse.mockImplementation(mockGetAssistantResponse);

    render(<ChatPage />);

    const inputField = screen.getByRole('textbox');
    const message = 'Test message';

    await userEvent.type(inputField, message);
    await userEvent.keyboard('Enter'); // Simulate Enter key press
    await fireEvent.submit(screen.getByRole('form'));

    expect(screen.getByText(/Please 🙏 Wait.../i)).toBeInTheDocument();
    waitFor(() => {
      expect(screen.queryByText(/Please 🙏 Wait.../i)).not.toBeInTheDocument();
      expect(screen.getByText(`Hey there! You said: ${message}`)).toBeInTheDocument(); // Check for assistant response
      expect(mockGetAssistantResponse).toHaveBeenCalledWith(message);
    });
  });
});
