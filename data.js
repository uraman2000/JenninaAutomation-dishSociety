// Array of store data from the spreadsheet

const checklist = [
  {
    time: "7:00 am",
    activity: "FOH OPENING",
  },
  {
    time: "8:00 am",
    activity: "Line Check",
  },
  {
    time: "4:00 pm",
    activity: "TRANSITION",
  },
  {
    time: "5:00 pm",
    activity: "Line Check",
  },
  {
    time: "11:30 pm",
    activity: "FOH CLOSING",
  },
  {
    time: "11:30 pm",
    activity: "FOH Deep Clean",
  },
  {
    time: "11:30 pm",
    activity: "BOH Deep Clean",
  },
];
const storeData = [
  {
    store: "Katy",
    gm: "Kevin Henry",
    checklist: [...checklist],
  },
  {
    store: "Heights",
    gm: "Elizabeth(Liza) Parada",
    checklist: [...checklist],
  },
  {
    store: "Memorial",
    gm: "Carla Puntarelli",
    checklist: [...checklist],
  },
  {
    store: "West U",
    gm: "Katie Nelson",
    checklist: [...checklist],
  },
  {
    store: "South First",
    gm: "Gina Perez",
    checklist: [...checklist],
  },
  {
    store: "Mueller",
    gm: "Ran Williams",
    checklist: [...checklist],
  },
  //   {
  //     store: "Daily gather",
  //     gm: "Ashely Breaux",
  //     time: "11:30 pm",
  //     checklist: "DISH - BOH Deep Clean"
  //   }
];

// Export the array to use in other files
module.exports = storeData;

// Function to generate formatted reminder output
const generateReminders = (storeData, incompleteItems) => {
  const fs = require('fs');
  let output = '';
  
  storeData.forEach(store => {
    const { store: storeName } = store;
    
    // Find incomplete items for this store
    const storeIncomplete = incompleteItems[storeName] || { lateItems: [], notCompletedItems: [] };
    
    output += `For ${storeName}\n\n`;
    
    let reminderText = '';
    
    if (storeIncomplete.lateItems.length > 0) {
      reminderText += `Reminder that the ${storeIncomplete.lateItems.join(', ')}, wasn't done on time. \n\n`;
    }
    
    if (storeIncomplete.notCompletedItems.length > 0) {
      if (reminderText) {
        reminderText += `Also, ${storeIncomplete.notCompletedItems.join(', ')} weren't completed. `;
      } else {
        reminderText += `Reminder that ${storeIncomplete.notCompletedItems.join(', ')}, weren't completed. `;
      }
    }
    
    if (reminderText) {
      output += reminderText + "Let's make sure we're all getting those checklists done accurately and on schedule\n";
    } else {
      output += "All checklists were completed correctly and on time. Great job!\n";
    }
    
    output += '\n' + '-'.repeat(Math.min(30, storeName.length + 20)) + '\n\n';
  });
  
  // Save to file
  saveToFile(output, 'output', 'store_reminders.txt');
  console.log('Reminders saved to store_reminders.txt');
  
  return output;
};

// Example usage:
/*
const incompleteItems = {
  "Katy": {
    lateItems: [],
    notCompletedItems: ["FOH Deep Clean", "BOH Deep Clean", "FOH Closing", "Line Check (AM and PM)", "Transition"]
  },
  "Heights": {
    lateItems: ["(AM) Line Check"],
    notCompletedItems: []
  },
  "Memorial": {
    lateItems: ["(AM) Line Check"],
    notCompletedItems: []
  },
  "West U": {
    lateItems: ["Transition"],
    notCompletedItems: ["FOH Opening", "(AM) Line Check", "FOH Deep Clean"]
  },
  "South First": {
    lateItems: ["FOH Opening"],
    notCompletedItems: ["FOH Deep Clean"]
  },
  "Mueller": {
    lateItems: [],
    notCompletedItems: ["(PM) Line Check", "FOH Deep Clean"]
  }
};

generateReminders(storeData, incompleteItems);
*/
