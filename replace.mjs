import fs from 'fs';

const files = [
    'src/utils/industryContent.js',
    'src/utils/demoData.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Arabic replacements
    content = content.replace(/وكيل/g, 'موظف');
    content = content.replace(/الوكيل/g, 'الموظف');
    content = content.replace(/وكلاؤنا/g, 'موظفونا');
    content = content.replace(/وكلائنا/g, 'موظفينا');
    content = content.replace(/وكيلنا/g, 'موظفنا');

    // English replacements
    content = content.replace(/(?<!\w)Agent(?!\w)/g, 'Employee');
    content = content.replace(/(?<!\w)Agents(?!\w)/g, 'Employees');
    content = content.replace(/(?<!\w)agent(?!\w)/g, 'employee');
    content = content.replace(/(?<!\w)agents(?!\w)/g, 'employees');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
});
