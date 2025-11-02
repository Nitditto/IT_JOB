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

export function handleFieldChange(dispatch: any) {
  return (e: any) => {
    dispatch({
        type: "CHANGE_FIELD",
        field: e.target.name,
        value: e.target.value
    })
  }
}

function readFileAsDataURL(file: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // This event fires when the file is successfully read
      reader.onload = (event) => {
        resolve({
          name: file.name,
          type: file.type,
          dataURL: event.target?.result // This is the ArrayBuffer (the "binary array")
        });
      };

      // This event fires if there's an error
      reader.onerror = (error) => {
        reject(error);
      };

      // This starts the read operation.
      reader.readAsDataURL(file);
    });
};
export function handleFileChange(dispatch: any) {
    return async (e: any) => {
      const fileList = e.target.files;
      console.log(`fileList: ${fileList}`)
      // 1. Check if any files are selected
      if (!fileList || fileList.length === 0) {
        dispatch({
          type: "CHANGE_FIELD",
          field: "images",
          value: []
        }); // Clear state if no files
        return;
      }

      // 2. Convert the FileList object to a standard array
      const files = Array.from(fileList);

      // 3. Create an array of promises (one for each file read)
      const fileReadPromises = files.map(readFileAsDataURL);

      // 

      try {
        // 4. Wait for ALL files to be read
        const allFilesData = await Promise.all(fileReadPromises)
                    dispatch({
          type: "CHANGE_FIELD",
          field: "images",
          value: allFilesData.map(value=>value.dataURL)
        });
        console.log("Successfully loaded files into state:", allFilesData);
        
        // 5. Save the resulting array of file data objects to state

      } catch (error) {
        console.error("Error reading one or more files:", error);
    };
  }
}
