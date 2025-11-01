export function formReducer(initialState: any) {
  return function reducer(state: any, action: any) {
    switch (action.type) {
      /**
       * Action: User is typing in a field.
       * We update the field's value and clear its specific error.
       */
      case 'CHANGE_FIELD':
        return {
          ...state,
          data: {
            ...state.data,
            [action.field]: action.value,
          },
          error: {
            ...state.error,
            [action.field]: "", // Clear error on change
          },
          status: { isError: false, reason: "" }, // Clear any global error
        };

      /**
       * Action: User submitted, but client-side validation failed.
       * We update all fieldErrors at once.
       */
      case 'VALIDATE_FAILURE':
        return {
          ...state,
          error: action.payload,
        };

      /**
       * Action: Form is valid, API call is starting.
       * We set loading state and clear all errors.
       */
      case 'SUBMIT_START':
        return {
          ...state,
          isLoading: true,
          status: { isError: false, reason: "" },
          error: initialState.error, // Clear all field errors
        };

      /**
       * Action: API call was successful.
       * We reset the entire form and show a success message.
       */
      case 'SUBMIT_SUCCESS':
        return {
          ...initialState, // Resets formData, fieldErrors, isLoading
          status: { isError: false, reason: action.payload },
        };

      /**
       * Action: API call failed.
       * We stop loading and show the error from the server.
       */
      case 'SUBMIT_FAILURE':
        return {
          ...state,
          isLoading: false,
          status: { isError: true, reason: action.payload },
        };

      default:
        return state;
    }
  }
}
