// Helper function to format date as "Month Day(th/st/nd/rd) Year" (copied from TabsManager)
export const formatDateCustom = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const year = date.getFullYear();
    const month = months[date.getMonth()];

    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) {
        suffix = "st";
    } else if (day === 2 || day === 22) {
        suffix = "nd";
    } else if (day === 3 || day === 23) {
        suffix = "rd";
    }

    // The original function returned an empty string with spaces,
    // assuming the actual implementation was omitted.
    // Returning the formatted date string here.
    return `${month} ${day}${suffix}, ${year}`;
};
