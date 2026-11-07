import { Component, type ReactNode } from 'react'

interface WebGLBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

// Lỗi khi tải chunk / tạo context WebGL thì quay về bản CSS
export class WebGLBoundary extends Component<WebGLBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
