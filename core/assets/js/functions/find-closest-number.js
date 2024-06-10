/**
 * Find the number (1st param) in an array (2nd param) that is closest to a given number.
 * @example
 * findClosestNumber(5, [1, 3, 6, 8]); // 6
 */
export default function findClosestNumber(target, numbers) {
    return numbers.reduce((closest, num) => Math.abs(num - target) < Math.abs(closest - target) ? num : closest);
}