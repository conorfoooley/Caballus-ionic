{
    const nl = '\n';
    const sep = ',';
    const quo = '"';
    let csv = '';
    let headers = `${quo}First Name${quo}${sep}${quo}Last Name${quo}${sep}${quo}Email${quo}${sep}${quo}Verified${quo}`;
    let rows = '';

    const users = db.getCollection('user').find({});
    users.forEach(user => {
        let userRow = "";
        if(user.profile !== undefined && user.profile.firstName !== undefined) {
            userRow += `${quo}${user.profile.firstName}${quo}`;
        }
        if(user.profile !== undefined && user.profile.lastName !== undefined) {
            if(userRow !== ""){
                userRow += sep;
            }
            userRow += `${quo}${user.profile.lastName}${quo}`;
        }
        if(user.profile !== undefined && user.profile.email !== undefined) {
            if(userRow !== ""){
                userRow += sep;
            }
            userRow += `${quo}${user.profile.email}${quo}`;
        }
        if(user.profile !== undefined && user.settings.verifiedEmail !== undefined) {
            if(userRow !== ""){
                userRow += sep;
            }
            userRow += `${quo}${user.settings.verifiedEmail}${quo}`;
        }            
        rows += userRow + nl;
    });

    headers += nl;

    csv += headers;
    csv += rows;
    
    print(csv);
}