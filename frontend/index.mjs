import { Command } from 'commander';
import inquirer from 'inquirer';
import axios from "axios";

const SERVICE_URLS = {
  catalog: 'http://localhost:3005',
  order: 'http://localhost:3006'
};

const program = new Command();
program.name('bazar-cli').description('CLI for Bazar Bookstore').version('1.0.0');

// Search command
program
  .command('search-book-title')
  .alias('s')
  .description('search about specific book using book topic')
  .action(async () => {
    const answers = await inquirer.prompt([{
      type: 'input',
      name: 'bookTitle',
      message: 'please enter book topic to get details about it: '
    }]);
    
    try {
      const result = await axios.get(`${SERVICE_URLS.catalog}/search/${answers.bookTitle}`);
      console.log('Books found:', result.data.items);
    } catch (error) {
      console.error('Error:', error.response?.data?.error || error.message);
    }
  });

// Info command
program
  .command('info-book-item-number')
  .alias('i')
  .description('info about specific book using item number')
  .action(async () => {
    const answers = await inquirer.prompt([{
      type: 'number',
      name: 'itemNumber',
      message: 'please enter items number to get info about it: '
    }]);
    
    try {
      const result = await axios.get(`${SERVICE_URLS.catalog}/info/${answers.itemNumber}`);
      console.log('Book info:', result.data.item);
    } catch (error) {
      console.error('Error:', error.response?.data?.error || error.message);
    }
  });

// Purchase command

program
  .command('purchase-book-by-item-number')
  .alias('p')
  .description('purchase specific book using item number')
  .action(async () => {
    const answers = await inquirer.prompt([{
      type: 'number',
      name: 'itemNumber',
      message: 'Enter book ID to purchase: '
    }]);
    
    try {
      const result = await axios.post(`${SERVICE_URLS.order}/purch`, {
        id: answers.itemNumber  // Only send ID now
      });
      console.log('Purchase result:', result.data.message);
    } catch (error) {
      console.error('Error:', error.response?.data?.error || error.message);
    }
  });