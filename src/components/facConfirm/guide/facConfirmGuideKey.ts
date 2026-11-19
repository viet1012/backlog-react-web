/**
 * Đổi version khi nội dung hướng dẫn thay đổi lớn
 * => user sẽ được tự động xem lại 1 lần.
 *
 * Tách riêng khỏi facConfirmGuideSteps: trang chỉ cần key để biết có tự mở
 * tour hay không, còn nội dung tour (bước + demo) được tải khi mở lần đầu.
 */
export const FAC_CONFIRM_GUIDE_KEY = 'guide:fac-confirm:v1'
