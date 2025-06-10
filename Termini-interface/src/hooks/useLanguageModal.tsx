import { useState, useCallback, ReactNode } from "react";
import { useLingui } from "@lingui/react";
import type { ModalProps } from "components/Modal/Modal";
import { t } from "@lingui/macro";
import ModalWithPortal from "components/Modal/ModalWithPortal";
import LanguageModalContent from "components/NetworkDropdown/LanguageModalContent";

// 导出语言模态框的键，使其可以在整个应用中使用
export const LANGUAGE_MODAL_KEY = "LANGUAGE";

export function useLanguageModal() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLanguageHovered, setIsLanguageHovered] = useState(false);
  const currentLanguage = useLingui().i18n.locale;

  // 处理语言模态框关闭
  const handleLanguageModalClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  // 打开语言模态框
  const openLanguageModal = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡，防止触发父组件的点击事件
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(LANGUAGE_MODAL_KEY);
  }, []);

  // 获取模态框属性
  const getModalProps = useCallback((modalName: string | null): ModalProps => {
    switch (modalName) {
      case LANGUAGE_MODAL_KEY:
        return {
          className: "language-popup language-modal-highest-z-index",
          isVisible: activeModal === LANGUAGE_MODAL_KEY,
          setIsVisible: () => setActiveModal(null),
          label: t`Select Language`,
          zIndex: 9999,
        };
      default:
        return {
          setIsVisible: () => { },
        };
    }
  }, [activeModal]);

  // 鼠标悬停处理函数
  const handleMouseEnter = useCallback(() => {
    setIsLanguageHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsLanguageHovered(false);
  }, []);

  // 获取模态框内容
  const getModalContent = useCallback((modalName: string | null): ReactNode => {
    switch (modalName) {
      case LANGUAGE_MODAL_KEY:
        return <LanguageModalContent currentLanguage={currentLanguage} onClose={handleLanguageModalClose} />;
      default:
        return null;
    }
  }, [currentLanguage, handleLanguageModalClose]);

  // 创建一个包含模态框的组件
  const LanguageModal = useCallback(() => {
    if (activeModal !== LANGUAGE_MODAL_KEY) return null;
    
    return (
      <ModalWithPortal {...getModalProps(activeModal)}>
        {getModalContent(activeModal)}
      </ModalWithPortal>
    );
  }, [activeModal, getModalProps, getModalContent]);

  return {
    activeModal,
    setActiveModal,
    isLanguageHovered,
    currentLanguage,
    handleLanguageModalClose,
    openLanguageModal,
    getModalProps,
    handleMouseEnter,
    handleMouseLeave,
    LanguageModal,
  };
} 