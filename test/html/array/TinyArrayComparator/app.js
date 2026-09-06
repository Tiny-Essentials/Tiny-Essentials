import { TinyArrayComparator } from '/src/v1/libs/array/TinyArrayComparator.mjs';

const oldFileInput = document.getElementById('oldFileInput');
const newFileInput = document.getElementById('newFileInput');
const idKeyInput = document.getElementById('idKeyInput');
const compareBtn = document.getElementById('compareBtn');
const deletedContent = document.getElementById('deletedContent');
const addedContent = document.getElementById('addedContent');
const editedContent = document.getElementById('editedContent');
const errorDisplay = document.getElementById('errorDisplay');

/**
 * Reads a file asynchronously and parses it as JSON.
 * @param {File} file - The file to read.
 * @returns {Promise<Array<any>>} The parsed JSON array.
 */
const readJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (!Array.isArray(parsedData)) {
          throw new Error(`The file ${file.name} does not contain a valid JSON array.`);
        }
        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Failed to parse ${file.name}: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error(`Error reading file ${file.name}`));
    reader.readAsText(file);
  });
};

/**
 * Handles the click event for the comparison button.
 */
const handleCompare = async () => {
  errorDisplay.textContent = ''; // Clear previous errors
  deletedContent.textContent = 'Loading...';
  addedContent.textContent = 'Loading...';
  editedContent.textContent = 'Loading...';

  const oldFile = oldFileInput.files[0];
  const newFile = newFileInput.files[0];

  if (!oldFile || !newFile) {
    errorDisplay.textContent = 'Please select both JSON files before comparing.';
    deletedContent.textContent = '';
    addedContent.textContent = '';
    editedContent.textContent = '';
    return;
  }

  try {
    // Read both files concurrently for better performance
    const [oldArray, newArray] = await Promise.all([readJsonFile(oldFile), readJsonFile(newFile)]);

    // Get the idKey from input. If empty, use null to trigger hash-only mode.
    const idKey = idKeyInput.value.trim() || null;

    const comparator = new TinyArrayComparator(oldArray, { idKey });
    const results = comparator.compare(newArray);
    window.comparator = comparator;

    // Filter the results to populate the distinct boxes
    const deletedItems = results.filter((req) => req.status === 'deleted').map((req) => req.item);
    const addedItems = results.filter((req) => req.status === 'added').map((req) => req.item);
    const editedItems = results.filter((req) => req.status === 'edited').map((req) => req.item);

    // Display formatting
    deletedContent.textContent =
      deletedItems.length > 0 ? JSON.stringify(deletedItems, null, 2) : 'No items were deleted.';

    addedContent.textContent =
      addedItems.length > 0 ? JSON.stringify(addedItems, null, 2) : 'No items were added.';

    editedContent.textContent =
      editedItems.length > 0 ? JSON.stringify(editedItems, null, 2) : 'No items were edited.';
  } catch (error) {
    errorDisplay.textContent = error.message;
    deletedContent.textContent = 'Error.';
    addedContent.textContent = 'Error.';
    editedContent.textContent = 'Error.';
  }
};

compareBtn.addEventListener('click', handleCompare);
