module.exports = {
  //extends: ['@commitlint/config-conventional'],
  rules: {
    "header-empty": [2, "never"],
    "header-min-length": [2, "always", 5],
    "no-russian-letters": [2, "always"],
    "type-enum": [
      2,
      "always",
      [
        "feat",    
        "fix",     
        "docs",    
        "style",   
        "refactor",
        "perf",    
        "test",    
        "build",   
        "ci",      
        "chore",   
        "revert",  
      ],
    ],
  },
  plugins: [
    {
      rules: {
        "no-russian-letters": ({ header }) => {
          const hasRussian = /[а-яА-ЯёЁ]/.test(header);
          return [
            !hasRussian,
            "Commit message must do not contain russian letters",
          ];
        },
      },
    },
  ],
};
