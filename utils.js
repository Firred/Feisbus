function calculateAge (birthday, current) {
    var birthday = new Date(birthday);
    var age = current.getFullYear() - birthday.getFullYear();
    var m = current.getMonth() - birthday.getMonth();

    if (m < 0 || (m === 0 && current.getDate() < birthday.getDate())) {
        age--;
    }

    return age;
}

module.exports = { 
    calculateAge: calculateAge
};