/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_itoa.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/12 14:13:18 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 14:01:04 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static unsigned int	ft_sizeofchar(unsigned int n)
{
	unsigned int	size;

	size = 0;
	if (n == 0)
		size = 1;
	while (n != 0)
	{
		n = n / 10;
		size++;
	}
	return (size);
}

char	*ft_itoa(int n)
{
	unsigned int		isntpos;
	unsigned int		len;
	unsigned int		npos;
	char				*result;

	isntpos = 0;
	if (n < 0)
		isntpos = 1;
	npos = -1 * n * (n < 0) + n * (n >= 0);
	len = ft_sizeofchar(npos) + isntpos;
	result = (char *)malloc(len + 1);
	if (!result)
		return (NULL);
	result[len--] = '\0';
	while (npos > 9)
	{
		result[len--] = npos % 10 + '0';
		npos = npos / 10;
	}
	result[len--] = npos + '0';
	if (isntpos)
		result[0] = '-';
	return (result);
}
