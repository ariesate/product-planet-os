export default interface IExample {
  /**
   * 名称
   */
  name: string;
   /**
   * 字段
   */
  fields: Array<{
    /**
     * 名称
     */
    name: string;
    /**
     * 字段类型
     */
    type: 'string' | 'rel';
    /**
     * 集合
     */
    isCollection: boolean;
  }>;
}