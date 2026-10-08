import {
  FAC_CONFIRM_PROCESS_CONFIG,
} from '../../../config/facConfirmProcessConfig'

import type { GuideStep } from './GuideTour'

import {
  FacConfirmConfirmDemo,
  FacConfirmEditDemo,
} from './FacConfirmGuideDemos'

import {
  FAC_GUIDE_FOCUS_EDIT_COLUMNS_EVENT,
  FAC_TOUR_EDIT_COLUMN_CLASS,
} from './facConfirmGuideEvents'

import {
  Badges,
  Faq,
  GuideBody,
  Hl,
  Kbd,
  Note,
  Options,
  OptionTable,
  Ui,
} from './GuideInline'


/**
 * Đổi version khi nội dung hướng dẫn thay đổi lớn
 * => user sẽ được tự động xem lại 1 lần.
 */
export const FAC_CONFIRM_GUIDE_KEY = 'guide:fac-confirm:v1'


export const facConfirmGuideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Chào mừng đến FAC CONFIRM',
    description: (
      <>
        Nhập và xác nhận thời gian công đoạn <Hl>Rough, Heat, Fine</Hl> theo ngày xuất hàng.
      </>
    ),
    bullets: [
      <><Kbd>←</Kbd><Kbd>→</Kbd> chuyển bước, <Kbd>Esc</Kbd> thoát</>,
      <>Mở lại bằng nút <Ui>?</Ui> trên đầu trang</>,
    ],
  },

  // =========================================================
  // THANH LỌC
  // =========================================================

  {
    id: 'div',
    targets: ['fac-div', 'fac-filter-bar'],
    step: 'Bước 1',
    title: 'Chọn Division',
    description: (
      <GuideBody>
        <Options items={['PRESS', 'PRESS Retainer', 'MOLD', 'GUIDE']} />
        <Badges kinds={['saved', 'clearsFilters']} />
      </GuideBody>
    ),
  },

  {
    id: 'date',
    targets: ['fac-date', 'fac-filter-bar'],
    step: 'Bước 2',
    title: 'Chọn Export Date',
    description: (
      <GuideBody>
        <span>Ngày xuất hàng cần xem.</span>
        <Badges kinds={['today']} />
      </GuideBody>
    ),
  },

  {
    id: 'proc-grp',
    targets: ['fac-procgrp', 'fac-filter-bar'],
    step: 'Bước 3',
    title: 'Chọn công đoạn bạn phụ trách',
    description: (
      <GuideBody>
        <span>
          <Hl>Chỉ nhập được</Hl> cột của công đoạn đang chọn:
        </span>
        <OptionTable
          rows={[
            {
              label: 'Rough',
              items: ['To Drill', 'To Heat'],
              color: FAC_CONFIRM_PROCESS_CONFIG.Rough.getColor,
            },
            {
              label: 'Heat',
              items: ['To CLG'],
              color: FAC_CONFIRM_PROCESS_CONFIG.Heat.getColor,
            },
            {
              label: 'Fine',
              items: ['To PK'],
              color: FAC_CONFIRM_PROCESS_CONFIG.Fine.getColor,
            },
          ]}
        />
        <Note>Hàng <Hl>Không có Heat</Hl>: Rough nhập To Drill và To CLG.</Note>
        <Badges kinds={['saved']} />
        <Note>Nút bị mờ: công đoạn đó chưa có dữ liệu.</Note>
      </GuideBody>
    ),
  },

  {
    id: 'classify',
    targets: ['fac-classify', 'fac-filter-bar'],
    step: 'Bước 4',
    title: 'Lọc loại hàng',
    description: (
      <GuideBody>
        <Options items={['Tất cả', 'Sale', 'Stock']} />
        <Badges kinds={['clearsFilters']} />
      </GuideBody>
    ),
  },

  {
    id: 'heat',
    targets: ['fac-heat', 'fac-filter-bar'],
    step: 'Bước 5',
    title: 'Chọn Heat Type',
    description: (
      <GuideBody>
        <span>Lựa chọn thay đổi theo Division:</span>
        <OptionTable
          rows={[
            { label: 'PRESS, Retainer', items: ['All', 'Normal', 'DC53', 'TD'] },
            { label: 'GUIDE', items: ['All', 'Normal', 'Molypden'] },
            { label: 'MOLD', items: ['All'] },
          ]}
        />
        <Badges kinds={['clearsFilters']} />
      </GuideBody>
    ),
  },

  {
    id: 'search',
    targets: ['fac-search', 'fac-filter-bar'],
    step: 'Bước 6',
    title: 'Tìm kiếm nhanh',
    description: (
      <>Gõ từ khóa, kết quả tự quay về <Hl>trang 1</Hl>.</>
    ),
  },

  // =========================================================
  // BẢNG
  // =========================================================

  {
    id: 'table',
    targets: ['fac-table'],
    placement: 'top',
    step: 'Bước 7',
    title: 'Xem và lọc dữ liệu',
    description: (
      <>Bấm vào <Hl>tiêu đề cột</Hl> để mở menu:</>
    ),
    bullets: [
      <><Ui>Sort A to Z</Ui><Ui>Sort Z to A</Ui> sắp xếp</>,
      <><Ui>Filter...</Ui> lọc như Excel</>,
      <>Kéo mép cột để đổi độ rộng</>,
    ],
  },

  {
    id: 'columns',
    targets: ['fac-columns', 'fac-table'],
    placement: 'bottom-end',
    step: 'Bước 8',
    title: 'Ẩn/hiện cột, xóa bộ lọc',
    bullets: [
      <><Ui>Columns</Ui> chọn cột muốn xem</>,
      <><Ui>Clear All</Ui> xóa mọi bộ lọc cột (chỉ hiện khi đang lọc)</>,
    ],
    description: <Badges kinds={['saved']} />,
  },

  {
    id: 'edit',
    targets: [`.${FAC_TOUR_EDIT_COLUMN_CLASS}`, 'fac-table'],
    // Đáy vùng dữ liệu (header + các dòng), không gồm thanh phân trang
    extendTo: '[data-tour="fac-table"] .MuiDataGrid-main',
    placement: 'left-start',
    onEnter: () => window.dispatchEvent(
      new CustomEvent(FAC_GUIDE_FOCUS_EDIT_COLUMNS_EVENT),
    ),
    step: 'Bước 9',
    title: 'Nhập thời gian công đoạn',
    media: <FacConfirmEditDemo />,
    description: (
      <>Bảng đã cuộn tới <Hl>các cột bạn được nhập</Hl> (đang sáng).</>
    ),
    bullets: [
      <><strong>Nhấp đúp</strong> vào ô, chọn ngày giờ, rồi <Ui>OK</Ui> hoặc <Kbd>Enter</Kbd></>,
      <>Kéo <strong>ô vuông ở góc ô</strong> để chép xuống dưới</>,
      <><Kbd>Delete</Kbd> xóa giá trị, <Kbd>Esc</Kbd> hủy nhập</>,
    ],
    after: (
      <Note tone="warning">
        <strong>Ô có dữ liệu Backlog bị khóa.</strong> Ô đã Fac Confirm vẫn sửa lại được.
      </Note>
    ),
  },

  {
    id: 'confirm',
    targets: ['fac-confirm-actions', 'fac-table'],
    placement: 'bottom-start',
    step: 'Bước 10',
    title: 'Lưu thay đổi',
    media: <FacConfirmConfirmDemo />,
    description: (
      <Note tone="warning">
        <strong>Chưa bấm Confirm thì dữ liệu chưa được lưu.</strong>
      </Note>
    ),
    bullets: [
      <><Ui filled>Confirm Changes (n)</Ui> để lưu, hệ thống tự ghi nhận tài khoản đang đăng nhập</>,
      <><Ui>Cancel Changes</Ui> hủy mọi thay đổi chưa lưu</>,
    ],
  },

  // =========================================================
  // HEADER
  // =========================================================

  {
    id: 'export',
    targets: ['fac-export'],
    placement: 'bottom-end',
    step: 'Bước 11',
    title: 'Xuất Excel',
    description: (
      <>Xuất <Hl>toàn bộ kết quả đang lọc</Hl> (mọi trang), đúng các cột đang hiện.</>
    ),
  },

  {
    id: 'refresh',
    targets: ['fac-refresh'],
    placement: 'bottom-end',
    step: 'Bước 12',
    title: 'Làm mới dữ liệu',
    description: 'Tải dữ liệu mới nhất. Giờ cập nhật hiện ở đầu trang.',
  },

  {
    id: 'done',
    title: 'Bạn đã sẵn sàng',
    description: (
      <GuideBody>
        <span>Gặp vấn đề? Kiểm tra nhanh:</span>
        <Faq
          items={[
            { q: 'Không sửa được ô', a: 'Chọn đúng công đoạn ở Bước 3. Ô có dữ liệu Backlog bị khóa.' },
            { q: 'Nút Rough / Heat / Fine bị mờ', a: 'Công đoạn đó chưa có dữ liệu với bộ lọc hiện tại.' },
            { q: 'Bộ lọc cột tự mất', a: 'Do vừa đổi Division, loại hàng hoặc Heat Type.' },
            { q: 'Không thấy dữ liệu', a: 'Kiểm tra Export Date, ô tìm kiếm và bộ lọc cột.' },
            { q: 'Thiếu cột', a: <>Mở lại bằng nút <Ui>Columns</Ui>.</> },
          ]}
        />
      </GuideBody>
    ),
  },
]
