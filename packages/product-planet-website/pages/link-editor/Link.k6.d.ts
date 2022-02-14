export default interface Relation {
    /**
     * 跳转名称
     */
    name: string;
    /**
     * 跳转方式
     */
    type: '新开窗口' | '当前页跳转';
  }