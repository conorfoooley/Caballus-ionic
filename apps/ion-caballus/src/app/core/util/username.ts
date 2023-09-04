export function generateUserNameFromEmail(email) {
    // Retrieve name from email address
    const nameParts = email.replace(/@.+/, "");
    // Replace all special characters like "@ . _ ";
    const name = nameParts.replace(/[&/\\#,+()$~%._@'":*?<>{}]/g, "");
    // Create and return unique username
    return name + Math.floor(Math.random() * 90 + 10)
}