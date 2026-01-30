// Synthetic test to verify setList countdown fix
// This simulates the handleVideoEnd logic to ensure it works correctly

// Simulate the ref pattern
class SetListLengthRef {
  constructor(initialLength) {
    this.current = initialLength;
  }
  
  update(newLength) {
    this.current = newLength;
  }
}

// Simulate handleVideoEnd logic
function handleVideoEnd(prevIndex, setListLengthRef) {
  if (prevIndex === null) return null;
  
  // Use ref to get current setList length (always up-to-date)
  const currentSetListLength = setListLengthRef.current;
  
  // If there's a next song, start countdown
  if (prevIndex < currentSetListLength - 1) {
    console.log(`✓ Song ${prevIndex} ended: ${prevIndex} < ${currentSetListLength - 1} = true → Playing next song (index ${prevIndex + 1})`);
    return prevIndex + 1; // Next song index
  } else {
    console.log(`✗ Song ${prevIndex} ended: ${prevIndex} < ${currentSetListLength - 1} = false → Set list complete`);
    return null; // Complete
  }
}

// Test Case 1: Set list with 4 songs (should work)
console.log('=== TEST CASE 1: Set list with 4 songs ===');
const ref1 = new SetListLengthRef(4);
let currentIndex1 = 0;

for (let i = 0; i < 5; i++) {
  const result = handleVideoEnd(currentIndex1, ref1);
  if (result === null) {
    console.log(`Set list completed after ${currentIndex1 + 1} songs\n`);
    break;
  }
  currentIndex1 = result;
}

// Test Case 2: Set list with 8 songs (the bug scenario)
console.log('=== TEST CASE 2: Set list with 8 songs (bug scenario) ===');
const ref2 = new SetListLengthRef(8);
let currentIndex2 = 0;

for (let i = 0; i < 10; i++) {
  const result = handleVideoEnd(currentIndex2, ref2);
  if (result === null) {
    console.log(`Set list completed after ${currentIndex2 + 1} songs\n`);
    break;
  }
  currentIndex2 = result;
}

// Test Case 3: Set list that grows from 4 to 8 songs (the actual bug scenario)
console.log('=== TEST CASE 3: Set list grows from 4 to 8 songs (actual bug) ===');
const ref3 = new SetListLengthRef(4);
let currentIndex3 = 0;

// Play first 3 songs with length 4
console.log('Playing songs with setList.length = 4:');
for (let i = 0; i < 3; i++) {
  const result = handleVideoEnd(currentIndex3, ref3);
  if (result === null) {
    console.log(`Set list completed after ${currentIndex3 + 1} songs`);
    break;
  }
  currentIndex3 = result;
}

// Now setList grows to 8 songs (simulating adding songs during playback)
console.log('\nSet list grows to 8 songs (ref updated)...');
ref3.update(8);

// Continue playing - this is where the bug would occur with old code
console.log('Continuing playback with setList.length = 8:');
for (let i = 0; i < 10; i++) {
  const result = handleVideoEnd(currentIndex3, ref3);
  if (result === null) {
    console.log(`Set list completed after ${currentIndex3 + 1} songs\n`);
    break;
  }
  currentIndex3 = result;
}

// Test Case 4: Verify the fix works - ref always has current value
console.log('=== TEST CASE 4: Verify ref always has current value ===');
const ref4 = new SetListLengthRef(4);
let currentIndex4 = 0;

console.log('Initial: setList.length = 4');
handleVideoEnd(0, ref4); // Should play next

ref4.update(8);
console.log('Updated: setList.length = 8');
handleVideoEnd(1, ref4); // Should play next (not stop)
handleVideoEnd(2, ref4); // Should play next (not stop)
handleVideoEnd(3, ref4); // Should play next (not stop - THIS IS WHERE BUG OCCURRED)
handleVideoEnd(4, ref4); // Should play next
handleVideoEnd(5, ref4); // Should play next
handleVideoEnd(6, ref4); // Should play next
const result = handleVideoEnd(7, ref4); // Should complete
if (result === null) {
  console.log('✓ Correctly completed after all 8 songs\n');
} else {
  console.log('✗ ERROR: Should have completed but returned:', result, '\n');
}

console.log('=== TEST SUMMARY ===');
console.log('If all tests show correct behavior, the fix should work!');
console.log('The key is that the ref always has the current setList.length value,');
console.log('so even if the callback was created when length was 4, it will use');
console.log('the updated length of 8 when checking if there are more songs.');
